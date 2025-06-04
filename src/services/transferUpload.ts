import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { constants } from "../core/constants.js";
import {
  ReservationConfirmResult,
  ReservationRequest,
  ReservationResponse,
  ReservationResponseFile,
  UploadInfo,
} from "../entities/skp.js";
import delay from "../utils/delay.js";
import { SkpApi } from "./apiSkp.js";

export class TransferUploadService {
  private skpApi: SkpApi;

  constructor(skpApi: SkpApi) {
    this.skpApi = skpApi;
  }

  public async uploadTransfer({
    filePaths,
    reservationRequest,
    onProgress,
    onReservationCreated,
    onReservationConfirm,
  }: {
    filePaths: string[];
    reservationRequest: ReservationRequest;
    onProgress: (progress: number) => void;
    onReservationCreated: () => void;
    onReservationConfirm: () => void;
  }): Promise<ReservationConfirmResult> {
    const totalFilesSize = reservationRequest.files.reduce(
      (acc, file) => acc + file.size,
      0
    );

    onProgress(0);
    let completedUploadSize = 0;
    let currentUploadSize = 0;

    const pushProgress = (uploadedBytes: number, startByte: number) => {
      currentUploadSize = completedUploadSize + startByte + uploadedBytes;
      let uploadProgress: number = Math.floor(
        (currentUploadSize / totalFilesSize) * 100
      );
      onProgress(Math.min(uploadProgress, 100));
    };

    const reservation: ReservationResponse =
      await this.skpApi.createReservation(reservationRequest);
    onReservationCreated();

    const uploadDataList: UploadData[] = filePaths.map((filePath, i) => ({
      reservedFile: reservation.files.find((f) => f.id === `${i}`)!,
      filePath,
      startByte: 0,
    }));

    for (const uploadData of uploadDataList) {
      await this.initiateUpload({
        currentChunkSize: constants.initialChunkSize,
        uploadData,
        reservationToken: reservation.token,
        shouldCheckUploadedFileSize: false,
        retryCount: 0,
        pushProgress,
      });
      completedUploadSize += uploadData.reservedFile.size;
    }

    onReservationConfirm();
    const result = await this.skpApi.confirmReservation(reservation.token);
    await delay(2);
    return result;
  }

  private async initiateUpload(props: InitiateUploadProp): Promise<void> {
    if (props.shouldCheckUploadedFileSize) {
      try {
        props.uploadData.startByte = await this.skpApi.fetchUploadedFileSize(
          props.uploadData.reservedFile.objectId,
          props.reservationToken
        );
      } catch (error) {
        if (props.retryCount >= constants.maxUploadRetries) throw error;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          props.uploadData.startByte = 0;
        } else {
          return await this.retryUpload(props);
        }
      }
    }

    props.uploadData.endByte = Math.min(
      props.uploadData.startByte + props.currentChunkSize,
      props.uploadData.reservedFile.size
    );

    props.uploadData.formData = await this.createUploadFormData(
      props.uploadData,
      props.reservationToken
    );

    try {
      const chunkUploadStartTime = Date.now();
      const response: UploadInfo = await this.skpApi.uploadFileChunk({
        startByte: props.uploadData.startByte,
        endByte: props.uploadData.endByte,
        formData: props.uploadData.formData,
        totalBytes: props.uploadData.reservedFile.size,
        onUploadProgress: (event) =>
          props.pushProgress(event.loaded, props.uploadData.startByte),
      });

      props.retryCount = 0;
      const duration = Math.floor((Date.now() - chunkUploadStartTime) / 1000);
      const newChunkSize = this.calculateNewChunkSize(
        duration,
        props.currentChunkSize
      );

      if (response.size < props.uploadData.reservedFile.size) {
        props.uploadData.startByte = response.size;

        return await this.initiateUpload({
          ...props,
          currentChunkSize: newChunkSize,
          shouldCheckUploadedFileSize: false,
        });
      }
    } catch (error) {
      if (props.retryCount >= constants.maxUploadRetries) throw error;
      return await this.retryUpload(props);
    }
  }

  private async retryUpload(props: InitiateUploadProp): Promise<void> {
    props.retryCount++;
    const wait = Math.min(
      2 ** props.retryCount,
      constants.maxDelayBetweenRetriesSec
    );
    await delay(wait);
    props.uploadData.startByte = 0;
    props.shouldCheckUploadedFileSize = true;
    return await this.initiateUpload(props);
  }

  private async createUploadFormData(
    uploadData: UploadData,
    token: string
  ): Promise<FormData> {
    const stream = fs.createReadStream(uploadData.filePath, {
      start: uploadData.startByte,
      end: uploadData.endByte! - 1, // `end` is inclusive
    });

    const formData = new FormData();
    formData.append("objectId", uploadData.reservedFile.objectId);
    formData.append("authToken", token);
    formData.append("f", stream, {
      filename: uploadData.reservedFile.name,
      knownLength: uploadData.endByte! - uploadData.startByte,
    });

    return formData;
  }

  private calculateNewChunkSize(duration: number, currentSize: number): number {
    const factor = constants.idealChunkUploadDuration / duration;
    const newSize = Math.round(currentSize * factor);
    return Math.min(newSize, constants.maxChunkSize);
  }
}

type UploadData = {
  reservedFile: ReservationResponseFile;
  filePath: string;
  startByte: number;
  endByte?: number;
  formData?: FormData;
};

type InitiateUploadProp = {
  currentChunkSize: number;
  shouldCheckUploadedFileSize: boolean;
  uploadData: UploadData;
  reservationToken: string;
  retryCount: number;
  pushProgress: (progress: number, startByte: number) => void;
};
