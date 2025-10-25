import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendOrderCompletedEventStep } from "../steps";

type WorkflowInput = {
  order: any;
};

type WorkflowOutput = {
  result: string;
};

export const sendOrderCompletedToKlaviyoWorkflow = createWorkflow(
  "send-order-completed-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { order } = input;

    // Send order completed/delivered event to Klaviyo
    const result = sendOrderCompletedEventStep({ order });

    return new WorkflowResponse({
      result,
    });
  }
);

export default sendOrderCompletedToKlaviyoWorkflow;

