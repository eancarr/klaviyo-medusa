import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  PostProfileResponse,
  ProfileCreateQueryResourceObjectAttributes,
} from "klaviyo-api";
import addProfileStep from "./steps/add-profile";

type WorkflowOutput = {
  profile: PostProfileResponse;
};

const addSubscriberWorkflow = createWorkflow(
  "add-subscriber",
  (
    input: ProfileCreateQueryResourceObjectAttributes
  ): WorkflowResponse<WorkflowOutput> => {
    const profile = addProfileStep(input);

    return new WorkflowResponse({
      profile,
    });
  }
);

export default addSubscriberWorkflow;
