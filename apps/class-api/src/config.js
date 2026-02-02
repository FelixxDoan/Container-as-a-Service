// config.js
export const ZONES_PATH = process.env.ZONES_PATH || "/zones";

export const DOMAIN_SUFFIX = (process.env.DOMAIN_SUFFIX || "test").replace(/\.$/, "");

export const HOST_IP = process.env.HOST_IP || "192.168.1.7";

export const TRAEFIK_NAME = process.env.TRAEFIK_NAME || "traefik";
