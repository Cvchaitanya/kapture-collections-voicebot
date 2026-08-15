# Kapture Finance – Outbound Collections Voicebot

## Project Overview

Kapture Finance is an outbound voice AI collections agent designed to contact customers with overdue loan EMIs.

The voice agent, Maya, handles routine collections conversations politely and compliantly. The agent verifies the customer's identity, explains the overdue EMI, understands the customer's payment intent, records a payment commitment, and ends the call appropriately.

---

## Customer Scenario

- Customer Name: Rahul Sharma
- Customer ID: CUST001
- Loan Type: Personal Loan
- Overdue EMI: ₹8,499
- Days Past Due: 12 days
- Verification Code: 1234

---

## Agent

**Name:** Maya  
**Company:** Kapture Finance  
**Purpose:** Outbound overdue EMI collections

---

## Conversation Flow

1. Maya greets the customer and confirms the customer's identity.
2. The customer is verified using the verification tool.
3. Maya discloses that the call is regarding the overdue personal loan EMI.
4. Maya informs the customer about the overdue amount of ₹8,499.
5. Maya asks when the customer will be able to make the payment.
6. The customer provides a payment commitment.
7. Maya asks for the payment amount.
8. The payment commitment is recorded using the payment commitment tool.
9. Maya confirms that the commitment has been recorded.
10. The outbound call is ended successfully.

---

## Vapi Tools

### 1. verify_customer

Verifies the customer's identity and retrieves the customer's loan and overdue EMI information.

Example customer:

```text
Customer ID: CUST001
Customer: Rahul Sharma
Loan Type: Personal Loan
Overdue EMI: ₹8,499
Days Past Due: 12