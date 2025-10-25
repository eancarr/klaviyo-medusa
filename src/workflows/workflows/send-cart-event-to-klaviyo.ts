import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import { sendCartEventStep } from "../steps";

type WorkflowInput = {
  cart: any;
  eventName: "Added to Cart" | "Started Checkout";
  addedItem?: any;
};

type WorkflowOutput = {
  result: string;
};

export const sendCartEventToKlaviyoWorkflow = createWorkflow(
  "send-cart-event-to-klaviyo",
  (input: WorkflowInput): WorkflowResponse<WorkflowOutput> => {
    const { cart, eventName, addedItem } = input;

    // Send cart event to Klaviyo
    const result = sendCartEventStep({ cart, eventName, addedItem });

    return new WorkflowResponse({
      result,
    });
  }
);

export default sendCartEventToKlaviyoWorkflow;

