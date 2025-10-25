import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendOrderShippedEventStep } from "../steps";

type WorkflowInput = {
  order: any;
  fulfillment: any;
};

type WorkflowOutput = {
  result: string;
};

export const sendOrderShippedToKlaviyoWorkflow = createWorkflow(
  "send-order-shipped-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { order, fulfillment } = input;

    // Send order shipped event to Klaviyo
    const result = sendOrderShippedEventStep({ order, fulfillment });

    return new WorkflowResponse({
      result,
    });
  }
);

export default sendOrderShippedToKlaviyoWorkflow;

