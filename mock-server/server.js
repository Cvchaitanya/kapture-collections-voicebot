const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Kapture Collections Mock Server is running",
  });
});

// Vapi webhook
app.post("/webhook", (req, res) => {
  console.log("\n========================================");
  console.log("VAPI WEBHOOK RECEIVED");
  console.log("========================================");

  console.log("Request Body:");
  console.log(JSON.stringify(req.body, null, 2));

  const body = req.body;

  // --------------------------------------------------
  // VAPI TOOL CALL FORMAT
  // --------------------------------------------------

  let toolCalls = [];

  if (body.message && Array.isArray(body.message.toolCallList)) {
    toolCalls = body.message.toolCallList;
  } else if (Array.isArray(body.toolCallList)) {
    toolCalls = body.toolCallList;
  } else if (Array.isArray(body.toolCalls)) {
    toolCalls = body.toolCalls;
  }

  // --------------------------------------------------
  // If Vapi sends a single tool call
  // --------------------------------------------------

  if (body.message && body.message.toolCall) {
    toolCalls = [body.message.toolCall];
  }

  // --------------------------------------------------
  // Process tool calls
  // --------------------------------------------------

  const results = toolCalls.map((toolCall) => {
    const toolCallId =
      toolCall.id ||
      toolCall.toolCallId ||
      `call_${Date.now()}`;

    const functionName =
      toolCall.name ||
      (toolCall.function && toolCall.function.name) ||
      "unknown";

    let args =
      toolCall.arguments ||
      (toolCall.function && toolCall.function.arguments) ||
      {};

    // Arguments can arrive as JSON string
    if (typeof args === "string") {
      try {
        args = JSON.parse(args);
      } catch (error) {
        console.log("Could not parse arguments:", args);
      }
    }

    console.log("\nTool Name:", functionName);
    console.log("Tool Call ID:", toolCallId);
    console.log("Arguments:", JSON.stringify(args, null, 2));

    // --------------------------------------------------
    // LOG PAYMENT COMMITMENT
    // --------------------------------------------------

    if (functionName === "log_payment_commitment") {
      const amount = args.amount;
      const ptpDate = args.ptp_date;
      const customerId = args.customer_id;
      const paymentMethod = args.payment_method;

      console.log("\n******** PAYMENT COMMITMENT ********");
      console.log("Customer ID:", customerId);
      console.log("Amount:", amount);
      console.log("PTP Date:", ptpDate);
      console.log("Payment Method:", paymentMethod);
      console.log("************************************");

      return {
        toolCallId: toolCallId,
        result: JSON.stringify({
          success: true,
          message: "Payment commitment recorded successfully",
          customer_id: customerId,
          amount: amount,
          ptp_date: ptpDate,
          payment_method: paymentMethod,
        }),
      };
    }

    // --------------------------------------------------
    // VERIFY CUSTOMER
    // --------------------------------------------------

    if (functionName === "verify_customer") {
      console.log("\n******** CUSTOMER VERIFICATION ********");

      return {
        toolCallId: toolCallId,
        result: JSON.stringify({
          success: true,
          verified: true,
          customer_id: "CUST001",
          message: "Customer verified successfully",
        }),
      };
    }

    // --------------------------------------------------
    // UNKNOWN TOOL
    // --------------------------------------------------

    return {
      toolCallId: toolCallId,
      result: JSON.stringify({
        success: false,
        message: `Unknown tool: ${functionName}`,
      }),
    };
  });

  // --------------------------------------------------
  // VAPI RESPONSE
  // --------------------------------------------------

  if (results.length > 0) {
    return res.status(200).json({
      results: results,
    });
  }

  // --------------------------------------------------
  // Direct/manual request
  // --------------------------------------------------

  if (
    body.amount !== undefined ||
    body.ptp_date !== undefined ||
    body.customer_id !== undefined
  ) {
    console.log("\nDirect payment commitment request");

    return res.status(200).json({
      success: true,
      message: "Payment commitment recorded successfully",
      data: {
        customer_id: body.customer_id,
        amount: body.amount,
        ptp_date: body.ptp_date,
        payment_method: body.payment_method,
      },
    });
  }

  // --------------------------------------------------
  // Unknown request
  // --------------------------------------------------

  return res.status(200).json({
    success: true,
    message: "Webhook received",
  });
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log("\n========================================");
  console.log("KAPTURE COLLECTIONS MOCK SERVER");
  console.log("========================================");
  console.log(`Server running on port ${PORT}`);
  console.log(`Local URL: http://localhost:${PORT}`);
  console.log(`Webhook: http://localhost:${PORT}/webhook`);
  console.log("========================================\n");
});