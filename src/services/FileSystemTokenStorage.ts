import path from "path";
import {ITokenStorage} from "./ITokenStorage";
import fs from "fs";

export class FileSystemTokenStorage implements ITokenStorage {
    private filePath = path.join(__dirname, ".teambeam.data.json");

    persistToken(token: string): void {
        const tokenDAO = this.read();
        tokenDAO.token = token;

        this.write(tokenDAO);
    }

    fetchToken(): string | null {
        return this.read().token;
    }

    removeToken(): void {
        const tokenDAO = this.read();
        tokenDAO.token = null;

        this.write(tokenDAO);
    }

    private read(): TokenDAO {
        try {
            const payload = fs.readFileSync(this.filePath, 'utf-8');
            const tokenDAO: TokenDAO = JSON.parse(payload);
            return tokenDAO;
        } catch {
            return <TokenDAO>{}
        }
    }

    private write(tokenDAO: TokenDAO): void {
        fs.writeFileSync(this.filePath, JSON.stringify(tokenDAO, null, 2));
    }
}

interface TokenDAO {
    token: string | null;
}