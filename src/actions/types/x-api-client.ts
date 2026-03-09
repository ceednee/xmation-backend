import type { XTweetApi } from "./x-tweet-api";
import type { XUserApi } from "./x-user-api";
import type { XMessageApi } from "./x-message-api";

export interface XApiClient extends XTweetApi, XUserApi, XMessageApi {}
