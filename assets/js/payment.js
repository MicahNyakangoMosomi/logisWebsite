let payment = false;
console.log("connected");
console.log(payment);
const paymentButton = document.getElementById("payment-btn");

paymentButton.addEventListener("click", function () {
  localStorage.setItem("payment", true); // Store boolean as string
  alert("Payment Successful!");
});