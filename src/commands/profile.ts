import environmentService from "../services/EnvironmentService";
import {fetchProfile} from "../services/skalioId/profile";
import {AccessService} from "../services/AccessService";
import serviceLocator from "../services/ServiceLocator";
import * as symbols from "../services/symbols";

export const showProfile = async () => {
    const accessService: AccessService = serviceLocator.get<AccessService>(symbols.accessService);
    await environmentService.load();

    console.log("Fetching Profile...");
    const profile = await fetchProfile(
        environmentService.getBaseUrl(),
        await accessService.getAccessToken()
    );
    console.log();
    console.log("Name      : ", profile.name);
    console.log("UID       : ", profile.uid);
    console.log("Locale    : ", profile.locale, ",", profile.timeZone);
    console.log("Emails    :");
    for (const email of profile.emails) {
        console.log(" - ", email.address, " ", email.primary ? "(primary)" : "");
    }
    if (profile.membership) {
        console.log("Member of : ", profile.membership.organization.name, " (", profile.membership.organization.uid, ") ");
        console.log("Roles     : ", profile.membership.roles);
    }

}