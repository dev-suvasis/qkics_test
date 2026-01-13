// Razorpay configuration
export const RAZORPAY_CONFIG = {
    // Replace with your actual Razorpay Key ID from Razorpay Dashboard
    // Test key format: rzp_test_XXXXXXXXXXXXX
    // Live key format: rzp_live_XXXXXXXXXXXXX
    // Get your key from: https://dashboard.razorpay.com/app/keys
    key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_PLACEHOLDER",

    // Company details shown in Razorpay checkout modal
    name: "Qkics",
    description: "Expert Session Booking",

    // Theme color for Razorpay modal (matches your app's red theme)
    theme: {
        color: "#dc2626", // red-600
    },

    // Currency
    currency: "INR",
};
