// gateway/src/services/homework.service.js
const homework_service = process.env.HOMEWORK_SERVICE

export const getFoldersService = async (folderPrefix) => {
    const url = `${homework_service}/folders?folderPrefix=${folderPrefix}`;
    const r = await fetch(url, {
        method: "GET",
    });

    const text = await r.text();
    const {data} = text ? JSON.parse(text) : null;
    console.log("data: ", data);
    if (!r.ok) {
        const message = (data && data.message) || `Homework service error ${r.status}`;
        const err = new Error(message);
        err.httpStatus = r.status;
        err.payload = data;
        throw err;
    }
    return { status: r.status || 200, data };
};

export const getObjectStreamService = async (objectName) => {
    const url = `${homework_service}/object?objectName=${objectName}`;
    const r = await fetch(url, {
        method: "GET",
    });

    const text = await r.text();
    const {data} = text ? JSON.parse(text) : null;

    if (!r.ok) {
        const message = (data && data.message) || `Homework service error ${r.status}`;
        const err = new Error(message);
        err.httpStatus = r.status;
        err.payload = data;
        throw err;
    }
    return { status: r.status || 200, data };
};