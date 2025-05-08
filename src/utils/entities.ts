import { TransferReceiver } from "../entities/skp.js";

export const mapRecipients = (type: "to" | "cc" | "bcc", list?: string[]) =>
    list?.map<TransferReceiver>((email) => ({ email, type })) || [];