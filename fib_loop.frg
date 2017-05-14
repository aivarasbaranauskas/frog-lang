{
    func fib(x)
    {
        if (x <= 2) {
            1
        } else {
            a -> 1
            b -> 1
            for (i -> 3 to x) {
                b -> a + b
                a -> b - a
            }
            b
        }
    }

    print(fib(6))
}