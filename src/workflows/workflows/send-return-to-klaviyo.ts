import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendReturnEventStep } from "../steps";

type WorkflowInput = {
  order: any;
  returnData: any;
  eventName: "Return Requested" | "Return Received";
};

type WorkflowOutput = {
  result: string;
};

export const sendReturnToKlaviyoWorkflow = createWorkflow(
  "send-return-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { order, returnData, eventName } = input;

    // Send return event to Klaviyo
    const result = sendReturnEventStep({ order, returnData, eventName });

    return new WorkflowResponse({
      result,
    });
  }
);

export default sendReturnToKlaviyoWorkflow;

