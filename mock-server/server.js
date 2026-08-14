const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ========================================
// CUSTOMER DATA
// ========================================

const CUSTOMER = {
  customer_id: "CUST001",
  name: "Rahul Sharma",
  loan_type: "Personal Loan",
  overdue_emi_inr: 8499,
  days_past_due: 12
};

// Demo verification code
const VERIFICATION_CODE = "1234";

// ========================================
// HELPER FUNCTIONS
// ========================================

function normalizeCustomerId(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function normalizeVerificationCode(value) {
  return String(value ?? "")
    .trim()
    .replace(/\D/g, "");
}

// ========================================
// HEALTH CHECK
// ========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Kapture Finance Mock Server is running"
  });
});

// ========================================
// VERIFY CUSTOMER
// ========================================

app.post("/verify-customer", (req, res) => {
  const {
    call_id,
    customer_id,
    verification_code
  } = req.body || {};

  const normalizedCustomerId =
    normalizeCustomerId(customer_id);

  const normalizedVerificationCode =
    normalizeVerificationCode(verification_code);

  console.log("========================================");
  console.log("VERIFY CUSTOMER");
  console.log("call_id:", call_id);
  console.log("customer_id received:", customer_id);
  console.log("customer_id normalized:", normalizedCustomerId);
  console.log("verification_code received:", verification_code);
  console.log(
    "verification_code normalized:",
    normalizedVerificationCode
  );
  console.log(
    "expected verification code:",
    VERIFICATION_CODE
  );
  console.log("========================================");

  if (!call_id || !customer_id || !verification_code) {
    return res.status(400).json({
      success: false,
      status: "FAILED",
      message: "Missing required fields"
    });
  }

  const verified =
    normalizedCustomerId === CUSTOMER.customer_id &&
    normalizedVerificationCode === VERIFICATION_CODE;

  if (verified) {
    console.log("CUSTOMER VERIFIED");

    return res.json({
      success: true,
      status: "VERIFIED",
      customer: CUSTOMER
    });
  }

  console.log("CUSTOMER VERIFICATION FAILED");

  return res.json({
    success: false,
    status: "FAILED",
    message: "Customer verification failed"
  });
});

// ========================================
// LOG PAYMENT COMMITMENT
// ========================================

app.post("/log-payment-commitment", (req, res) => {
  const {
    call_id,
    customer_id,
    payment_date,
    payment_amount,
    notes
  } = req.body || {};

  if (!call_id || !customer_id || !payment_date) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  console.log("========================================");
  console.log("PAYMENT COMMITMENT");
  console.log("call_id:", call_id);
  console.log("customer_id:", customer_id);
  console.log("payment_date:", payment_date);
  console.log("payment_amount:", payment_amount);
  console.log("notes:", notes);
  console.log("========================================");

  return res.json({
    success: true,
    message: "Payment commitment recorded successfully",
    commitment: {
      call_id,
      customer_id,
      payment_date,
      payment_amount: payment_amount ?? null,
      notes: notes || ""
    }
  });
});

// ========================================
// LOG PROMISE TO PAY
// ========================================

app.post("/log-promise-to-pay", (req, res) => {
  const {
    call_id,
    customer_id,
    ptp_date,
    ptp_amount_inr,
    notes
  } = req.body || {};

  if (!call_id || !customer_id || !ptp_date) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  console.log("Promise to Pay:", {
    call_id,
    customer_id,
    ptp_date,
    ptp_amount_inr,
    notes
  });

  return res.json({
    success: true,
    message: "Promise-to-Pay recorded successfully",
    ptp: {
      call_id,
      customer_id,
      ptp_date,
      ptp_amount_inr: ptp_amount_inr ?? null,
      notes: notes || ""
    }
  });
});

// ========================================
// SEND PAYMENT LINK
// ========================================

app.post("/send-payment-link", (req, res) => {
  const {
    call_id,
    customer_id,
    channel = "SMS"
  } = req.body || {};

  if (!call_id || !customer_id) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  const paymentLink =
    `https://pay.kapturefinance.com/pay/${customer_id}`;

  console.log("Payment link requested:", {
    call_id,
    customer_id,
    channel
  });

  return res.json({
    success: true,
    message: "Payment link sent successfully",
    payment_link: paymentLink,
    channel
  });
});

// ========================================
// ESCALATE TO AGENT
// ========================================

app.post("/escalate-to-agent", (req, res) => {
  const {
    call_id,
    customer_id,
    reason,
    notes
  } = req.body || {};

  if (!call_id || !customer_id || !reason) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  console.log("Escalation:", {
    call_id,
    customer_id,
    reason,
    notes
  });

  return res.json({
    success: true,
    message: "Escalation recorded successfully",
    escalation: {
      call_id,
      customer_id,
      reason,
      notes: notes || ""
    }
  });
});

// ========================================
// MARK DISPOSITION
// ========================================

app.post("/mark-disposition", (req, res) => {
  const {
    call_id,
    customer_id,
    status,
    notes
  } = req.body || {};

  if (!call_id || !customer_id || !status) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields"
    });
  }

  console.log("Disposition:", {
    call_id,
    customer_id,
    status,
    notes
  });

  return res.json({
    success: true,
    message: "Disposition recorded successfully",
    disposition: {
      call_id,
      customer_id,
      status,
      notes: notes || ""
    }
  });
});

// ========================================
// VAPI WEBHOOK
// ========================================

app.post("/webhook", (req, res) => {
  console.log("\n========================================");
  console.log("VAPI WEBHOOK RECEIVED");
  console.log("========================================");

  console.log(
    JSON.stringify(req.body, null, 2)
  );

  const message = req.body?.message;

  // Ignore non-tool messages
  if (!message || message.type !== "tool-calls") {
    return res.json({
      success: true
    });
  }

  const toolCallList =
    message.toolCallList ||
    message.toolCalls ||
    [];

  const results = toolCallList.map((toolCall) => {

    const id =
      toolCall.id ||
      toolCall.toolCallId;

    const name =
      toolCall.name ||
      toolCall.function?.name;

    // ========================================
    // IMPORTANT:
    // Vapi may send function.arguments as a
    // JSON STRING instead of an object.
    // Parse it before accessing parameters.
    // ========================================

    let parameters =
      toolCall.parameters ||
      toolCall.function?.arguments ||
      {};

    if (typeof parameters === "string") {
      try {
        parameters = JSON.parse(parameters);
      } catch (error) {
        console.log(
          "Failed to parse tool arguments:",
          parameters
        );

        parameters = {};
      }
    }

    console.log("\n----------------------------------------");
    console.log("TOOL:", name);
    console.log("ID:", id);
    console.log("PARAMETERS:", parameters);
    console.log("----------------------------------------");

    let result;

    // ======================================
    // VERIFY CUSTOMER
    // ======================================

    if (name === "verify_customer") {

      const customerId =
        normalizeCustomerId(
          parameters.customer_id
        );

      const verificationCode =
        normalizeVerificationCode(
          parameters.verification_code
        );

      console.log("\nVERIFY DEBUG");
      console.log(
        "Customer ID:",
        customerId
      );

      console.log(
        "Verification Code:",
        verificationCode
      );

      console.log(
        "Expected Code:",
        VERIFICATION_CODE
      );

      const verified =
        customerId === CUSTOMER.customer_id &&
        verificationCode === VERIFICATION_CODE;

      if (verified) {

        console.log(
          "VERIFY CUSTOMER SUCCESS"
        );

        result = {
          success: true,
          status: "VERIFIED",
          customer: CUSTOMER
        };

      } else {

        console.log(
          "VERIFY CUSTOMER FAILED"
        );

        result = {
          success: false,
          status: "FAILED",
          message: "Customer verification failed"
        };
      }
    }

    // ======================================
    // LOG PAYMENT COMMITMENT
    // ======================================

    else if (
      name === "log_payment_commitment"
    ) {

      console.log(
        "PAYMENT COMMITMENT LOGGED"
      );

      result = {
        success: true,
        message:
          "Payment commitment recorded successfully",
        commitment: parameters
      };
    }

    // ======================================
    // LOG PROMISE TO PAY
    // ======================================

    else if (
      name === "log_promise_to_pay"
    ) {

      console.log(
        "PROMISE TO PAY LOGGED"
      );

      result = {
        success: true,
        message:
          "Promise-to-Pay recorded successfully",
        ptp: parameters
      };
    }

    // ======================================
    // SEND PAYMENT LINK
    // ======================================

    else if (
      name === "send_payment_link"
    ) {

      const customerId =
        parameters.customer_id ||
        parameters.account_id ||
        CUSTOMER.customer_id;

      const channel =
        parameters.channel || "SMS";

      result = {
        success: true,
        message:
          "Payment link sent successfully",
        payment_link:
          `https://pay.kapturefinance.com/pay/${customerId}`,
        channel
      };
    }

    // ======================================
    // ESCALATE TO AGENT
    // ======================================

    else if (
      name === "escalate_to_agent"
    ) {

      result = {
        success: true,
        message:
          "Escalation recorded successfully",
        escalation: parameters
      };
    }

    // ======================================
    // MARK DISPOSITION
    // ======================================

    else if (
      name === "mark_disposition"
    ) {

      result = {
        success: true,
        message:
          "Disposition recorded successfully",
        disposition: parameters
      };
    }

    // ======================================
    // UNKNOWN TOOL
    // ======================================

    else {

      console.log(
        "UNKNOWN TOOL:",
        name
      );

      result = {
        success: false,
        message: `Unknown tool: ${name}`
      };
    }

    return {
      name,
      toolCallId: id,
      result: JSON.stringify(result)
    };
  });

  console.log("\n========================================");
  console.log("VAPI RESPONSE");
  console.log(
    JSON.stringify(results, null, 2)
  );
  console.log("========================================\n");

  return res.json({
    results
  });
});

// ========================================
// START SERVER
// ========================================

app.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("KAPTURE FINANCE MOCK SERVER");
  console.log("========================================");

  console.log(
    `Server running at http://localhost:${PORT}`
  );

  console.log(
    "Verification Code: 1234"
  );

  console.log(
    "Customer ID: CUST001"
  );

  console.log("========================================");
});