import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendOrderCanceledEventStep } from "../steps";

type WorkflowInput = {
  order: any;
};

type WorkflowOutput = {
  result: string;
};

export const sendOrderCanceledToKlaviyoWorkflow = createWorkflow(
  "send-order-canceled-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { order } = input;

    // Send order canceled event to Klaviyo
    const result = sendOrderCanceledEventStep({ order });

    return new WorkflowResponse({
      result,
    });
  }
);

export default sendOrderCanceledToKlaviyoWorkflow;

