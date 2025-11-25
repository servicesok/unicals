// Example JavaScript file

const greet = (name) => {
    return `Hello, ${name}!`;
};

function calculateFactorial(n) {
    if (n <= 1) return 1;
    return n * calculateFactorial(n - 1);
}

// Test the functions
console.log(greet("World"));
console.log(`Factorial of 5: ${calculateFactorial(5)}`);

// Export for use in other modules
export { greet, calculateFactorial };
