import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { StoreOrder } from "@medusajs/types";
import { sendOrderEventStep } from "../steps";

type WorkflowInput = {
  order: StoreOrder;
};

type WorkflowOutput = {
  result: string;
};

export const sendOrderToKlaviyoWorkflow = createWorkflow(
  "send-order-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { order } = input;

    // Send order event to Klaviyo
    const result = sendOrderEventStep(order);

    return new WorkflowResponse({
      result,
    });
  }
);

export default sendOrderToKlaviyoWorkflow;
