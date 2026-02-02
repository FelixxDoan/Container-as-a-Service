import { handleRequest } from "@micro/utils";

import { getChildrenFolder, getObjectStream } from "../services/homework.service.js";

export const getChildrenFolderController = (req, res) => {
  const { folderPrefix } = req.query
  console.log("folderPrefix: ", folderPrefix);
  handleRequest(
    res,
    async () => await getChildrenFolder(folderPrefix).then((data) => ({ data }))
  );
};

export const getObjectStreamController = (req, res) => {
  const { objectName} = req.query
  handleRequest(
    res,
    async () => await getObjectStream(objectName).then((data) => ({ data }))
  );
};
  