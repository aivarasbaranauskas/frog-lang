{
    func fib(x::int)::int
    {
        if (x <= 2) {
            1
        } else {
            a::int
            b::int
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