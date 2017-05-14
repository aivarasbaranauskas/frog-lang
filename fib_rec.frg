{
    func fib(a)
    {
        if (a <= 2) {
            1
        } else {
            fib(a-2) + fib(a-1)
        }
    }

    print(fib(6))
}