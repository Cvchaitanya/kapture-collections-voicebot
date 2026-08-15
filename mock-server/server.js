const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* =========================================================
   MOCK CUSTOMER DATABASE
   ========================================================= */

const customers = {
  CUST001: {
    customer_id: "CUST001",
    customer_name: "Rahul Sharma",
    loan_type: "Personal Loan",
    overdue_amount: 8499,
    days_past_due: 12,
    verification_codes: ["1234", "1995"],
  },
};

/* =========================================================
   HELPERS
   ========================================================= */

function normalizeCustomerId(value) {
  if (!value) return "";

  return String(value)
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function parseArguments(args) {
  if (!args) return {};

  if (typeof args === "string") {
    try {
      return JSON.parse(args);
    } catch (error) {
      console.log("Could not parse tool arguments:", args);
      return {};
    }
  }

  return args;
}

function createToolResponse(toolCallId, result) {
  return {
    results: [
      {
        toolCallId: toolCallId,
        result: JSON.stringify(result),
      },
    ],
  };
}

/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "Kapture Finance Mock Collections Server",
    webhook: "/webhook",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    server: "kapture-collections-voicebot",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   VAPI WEBHOOK
   ========================================================= */

app.post("/webhook", (req, res) => {
  try {
    console.log("\n========================================");
    console.log("VAPI REQUEST RECEIVED");
    console.log("========================================");

    console.log("Request body:");
    console.log(JSON.stringify(req.body, null, 2));

    const message = req.body?.message;

    /* -------------------------------------------------------
       VAPI TOOL CALLS
       ------------------------------------------------------- */

    if (message && message.type === "tool-calls") {
      const toolCalls = message.toolCalls || [];

      if (!toolCalls.length) {
        return res.status(200).json({
          status: "no_tool_calls",
        });
      }

      const results = [];

      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id;

        const functionData = toolCall.function || {};

        const toolName = functionData.name;

        const args = parseArguments(functionData.arguments);

        console.log("\n----------------------------------------");
        console.log("TOOL:", toolName);
        console.log("ARGUMENTS:", args);
        console.log("----------------------------------------");

        let result;

        /* =====================================================
           VERIFY CUSTOMER
           ===================================================== */

        if (toolName === "verify_customer") {
          const customerId = normalizeCustomerId(
            args.customer_id || args.account_id
          );

          const verificationCode = String(
            args.verification_code || ""
          ).trim();

          console.log("Customer ID:", customerId);
          console.log("Verification Code:", verificationCode);

          const customer = customers[customerId];

          if (!customer) {
            result = {
              verified: false,
              success: false,
              message: "Customer record not found.",
            };
          } else if (
            customer.verification_codes.includes(verificationCode)
          ) {
            result = {
              verified: true,
              success: true,
              customer_id: customer.customer_id,
              customer_name: customer.customer_name,
              message: "Identity verified successfully.",
            };
          } else {
            result = {
              verified: false,
              success: false,
              message: "Verification failed. Incorrect verification code.",
            };
          }
        }

        /* =====================================================
           LOG PAYMENT COMMITMENT
           ===================================================== */

        else if (
          toolName === "log_payment_commitment" ||
          toolName === "log_promise_to_pay"
        ) {
          const customerId = normalizeCustomerId(
            args.customer_id || args.account_id
          );

          const customer = customers[customerId];

          const amount = Number(
            args.amount || args.payment_amount || 0
          );

          const ptpDate =
            args.ptp_date ||
            args.payment_date ||
            args.commitment_date ||
            "";

          if (!customer) {
            result = {
              success: false,
              message: "Customer record not found.",
            };
          } else if (!ptpDate) {
            result = {
              success: false,
              message: "Payment commitment date is required.",
            };
          } else if (!amount || amount <= 0) {
            result = {
              success: false,
              message: "Valid payment amount is required.",
            };
          } else {
            const ptpId =
              "PTP-" +
              Math.floor(1000 + Math.random() * 9000);

            result = {
              success: true,
              status: "SUCCESS",
              ptp_id: ptpId,
              customer_id: customerId,
              confirmed_date: ptpDate,
              amount: amount,
              message:
                "Payment commitment recorded successfully.",
              timestamp: new Date().toISOString(),
            };

            console.log("\nPAYMENT COMMITMENT SAVED");
            console.log("PTP ID:", ptpId);
            console.log("Customer:", customerId);
            console.log("Amount:", amount);
            console.log("Date:", ptpDate);
          }
        }

        /* =====================================================
           END OUTBOUND CALL
           ===================================================== */

        else if (
          toolName === "end_outbound_call" ||
          toolName === "endCall"
        ) {
          result = {
            success: true,
            message: "Outbound call ended successfully.",
          };

          console.log("Outbound call termination requested.");
        }

        /* =====================================================
           OPTIONAL: SEND PAYMENT LINK
           ===================================================== */

        else if (toolName === "send_payment_link") {
          const customerId = normalizeCustomerId(
            args.customer_id || args.account_id
          );

          const channel = args.channel || "SMS";

          result = {
            success: true,
            customer_id: customerId,
            channel: channel,
            link_sent: true,
            message:
              `Payment link sent successfully via ${channel}.`,
            timestamp: new Date().toISOString(),
          };

          console.log(
            `Payment link sent via ${channel} to ${customerId}`
          );
        }

        /* =====================================================
           OPTIONAL: MARK DISPOSITION
           ===================================================== */

        else if (toolName === "mark_disposition") {
          const customerId = normalizeCustomerId(
            args.customer_id || args.account_id
          );

          result = {
            success: true,
            customer_id: customerId,
            disposition_logged: args.status || "UNKNOWN",
            notes: args.notes || "",
            timestamp: new Date().toISOString(),
          };

          console.log(
            "Disposition:",
            args.status || "UNKNOWN"
          );
        }

        /* =====================================================
           UNKNOWN TOOL
           ===================================================== */

        else {
          console.log("UNKNOWN TOOL:", toolName);

          result = {
            success: false,
            message: `Unknown tool: ${toolName}`,
          };
        }

        results.push({
          toolCallId: toolCallId,
          result: JSON.stringify(result),
        });
      }

      console.log("\n========================================");
      console.log("VAPI RESPONSE");
      console.log("========================================");
      console.log(JSON.stringify(results, null, 2));

      return res.status(200).json({
        results: results,
      });
    }

    /* -------------------------------------------------------
       OTHER VAPI EVENTS
       ------------------------------------------------------- */

    console.log("Non-tool Vapi event received.");

    return res.status(200).json({
      status: "acknowledged",
    });
  } catch (error) {
    console.error("\n========================================");
    console.error("WEBHOOK ERROR");
    console.error("========================================");
    console.error(error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {
  console.log("\n========================================");
  console.log("KAPTURE FINANCE MOCK SERVER");
  console.log("========================================");
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook`);
  console.log(`Health endpoint: http://localhost:${PORT}/health`);
  console.log("----------------------------------------");
  console.log("Verification Code: 1234");
  console.log("Customer ID: CUST001");
  console.log("Customer: Rahul Sharma");
  console.log("========================================\n");
});