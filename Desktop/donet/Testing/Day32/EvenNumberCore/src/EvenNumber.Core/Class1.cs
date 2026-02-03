using System;

namespace EvenNumber.Core
{
    public class EvenNumberService
    {
        public int AcceptEven(int number)
        {
            if (number % 2 != 0)
            {
                throw new ArgumentException("Only even numbers allowed");
            }

            return number;
        }
    }
}
