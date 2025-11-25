"""
Example Python file to demonstrate syntax highlighting
"""

def greet(name):
    """Greet someone by name"""
    return f"Hello, {name}!"

def calculate_fibonacci(n):
    """Calculate the nth Fibonacci number"""
    if n <= 1:
        return n
    return calculate_fibonacci(n - 1) + calculate_fibonacci(n - 2)

if __name__ == "__main__":
    print(greet("World"))
    print(f"Fibonacci(10) = {calculate_fibonacci(10)}")
