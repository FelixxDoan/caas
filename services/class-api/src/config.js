export const ZONES_PATH = process.env.ZONES_PATH || "/zones";

// 'test' khuyến nghị; 'local' có thể bị mDNS OS chặn
export const DOMAIN_SUFFIX = (process.env.DOMAIN_SUFFIX || "test").replace(/^\./, "");

// A-record hướng về IP host để duyệt không cần port
export const HOST_IP = process.env.HOST_IP || "127.0.0.1";

// Tên container Traefik global trong infra.compose.yml
export const TRAEFIK_NAME = process.env.TRAEFIK_NAME || "traefik";

export const WORKSPACE_ROOT = "D:/WorkSpace/private_cloud/Student_workspace"
