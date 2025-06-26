document.addEventListener("DOMContentLoaded", function () {
  const paymentStatus = localStorage.getItem("payment") === "true"; // Convert back to boolean

  if (!paymentStatus) {
      alert("Make payment first!");
      window.location.href = "pricing.php"; // Redirect to pricing page
  }
});