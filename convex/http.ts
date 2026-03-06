import { httpRouter } from "convex/server";
import { auth } from "./auth";

const http = httpRouter();

// Mount Convex Auth at /auth
auth.addHttpRoutes(http);

export default http;
