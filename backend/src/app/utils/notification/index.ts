import { sendEmail } from "./service.js";
import { NOTIFICATION_PURPOSE } from "./constant.js";

export const sendNotification = async ({
  purpose,
  data,
}: {
  purpose: NOTIFICATION_PURPOSE;
  data: Record<string, any>;
}): Promise<void> => {
  await sendEmail({ purpose, data });
};

export { NOTIFICATION_PURPOSE } from "./constant.js";