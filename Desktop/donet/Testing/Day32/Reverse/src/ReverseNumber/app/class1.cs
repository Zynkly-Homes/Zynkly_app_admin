using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Numberscode.Features
{
    public class checking
    {
        public bool Even(int a)
        {
            return a % 2 == 0;
        }
        public int Sum_Of_N_Numbers(int a)
        {
            int sum = 0;
            for (int i = 1; i <= a; i++)
            {
                sum += i;
            }
            return sum;
        }
        public string Reverse_The_String(string a)
        {
            string reversed=new string(a.Reverse().ToArray());
            return reversed;
        }
    }
}