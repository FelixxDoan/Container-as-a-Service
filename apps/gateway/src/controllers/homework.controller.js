import {handleRequest} from "@micro/utils";
import { getFoldersService, getObjectStreamService } from "../services/homework.service.js";

export const getFoldersController = (req, res) => handleRequest(res, async () => {
    const { folderPrefix } = req.query;
    const result = await getFoldersService(folderPrefix);
    return result;
});

export const getObjectStreamController = (req, res) => handleRequest(res, async () => {
    const { objectName } = req.query;
    const result = await getObjectStreamService(objectName);
    return result;
});
