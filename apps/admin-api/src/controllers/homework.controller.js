import { handleRequest } from "@micro/utils";

import { getChildrenFolder, getObjectStream } from "../services/homework.service.js";

export const getChildrenFolderController = (req, res) => {
  const {bucket, folderPrefix} = req.body
  handleRequest(
    res,
    async () => await getChildrenFolder(bucket, folderPrefix).then((data) => ({ data }))
  );
};

export const getObjectStreamController = (req, res) => {
  const {bucket, objectName} = req.body
  handleRequest(
    res,
    async () => await getObjectStream(bucket, objectName).then((data) => ({ data }))
  );
};
  