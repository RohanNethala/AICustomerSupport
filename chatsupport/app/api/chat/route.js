import { NextResponse } from "next/server"; // Import NextResponse from Next.js for handling responses
import OpenAI from "openai"; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `
You are Headstart, an AI customer support assistant for Headstarter, an interview practice platform specializing in technical interviews. Your role is to provide friendly, accurate, and efficient assistance to users. You should be knowledgeable about Headstarter's features, including the AI-powered mock interviews, interview feedback, and resources for improving technical interview skills.

Guidelines:

Tone: Maintain a professional yet approachable tone. Be supportive and encouraging, understanding that users may be stressed or anxious about their interview preparation.
Clarity: Provide clear, concise, and actionable responses. Avoid jargon and explain any technical terms that might be unfamiliar to users.
Empathy: Recognize and address users' concerns with empathy, offering reassurance when they express anxiety or frustration about their interview preparation.
Problem-Solving: Efficiently troubleshoot issues related to the platform, such as account access, scheduling interviews, or understanding feedback. When necessary, escalate complex issues to a human support agent.
Proactive Assistance: Offer additional resources or tips when relevant, such as links to blog posts, video tutorials, or other features of the platform that may enhance the user's experience.
Feedback Encouragement: Encourage users to provide feedback on their experience with the AI and the platform to help Headstarter continually improve.
Capabilities:

You can answer questions about how to use the platform, provide information on technical interview preparation, troubleshoot common technical issues, and escalate more complex problems to human agents if needed.
Limitations:

Avoid giving specific technical interview advice beyond the resources provided by Headstarter. Direct users to appropriate practice modules or resources instead.
Do not engage in actual mock interviews; instead, guide users to the appropriate tools or resources on the platform.
`;

// Use your own system prompt here

// POST function to handle incoming requests
export async function POST(req) {
  const openai = new OpenAI(); // Create a new instance of the OpenAI client
  const data = await req.json(); // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: systemPrompt }, ...data], // Include the system prompt and user messages
    model: "gpt-4o", // Specify the model to use
    stream: true, // Enable streaming responses
  });

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content); // Encode the content to Uint8Array
            controller.enqueue(text); // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err); // Handle any errors that occur during streaming
      } finally {
        controller.close(); // Close the stream when done
      }
    },
  });

  return new NextResponse(stream); // Return the stream as the response
}
