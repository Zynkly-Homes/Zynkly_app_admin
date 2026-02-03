using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Numberscode.Features;

namespace Test
{
    [TestClass]
    public class Class1
    {
        [TestMethod]
        public void Even_Check()
        {
            var cal = new checking();
            bool result=cal.Even(8);
            Assert.IsTrue(result);

        }
        [TestMethod]
        
        public void Sum_of_n_number_givenoneinput()
        {
            var cal = new checking();
            int n = cal.Sum_Of_N_Numbers(5);
            Assert.AreEqual(15, n);
        }
        [TestMethod]
        [DataRow(3, 6)]
        [DataRow(4, 10)]
        public void Sum_of_n_number_Input_output(int a,int expected){
            var cal = new checking();
            int n = cal.Sum_Of_N_Numbers(a);
            Assert.AreEqual(expected, n);
        }
        [TestMethod]
        public void Reverse_String()
        {
            var cal = new checking();
            string result = cal.Reverse_The_String("Hello");
            Assert.AreEqual("olleH", result);
        }
    }
}