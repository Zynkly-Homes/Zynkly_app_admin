using Microsoft.VisualStudio.TestTools.UnitTesting;
using CalcUnitTesting.core;

namespace CalculatorTestProj
{
[TestClass]
public class CalculatorTest
{
    [TestMethod]
    public void Add_Test()
    {
        Calculator calc = new Calculator();
        int result = calc.Add(5, 3);
        Assert.AreEqual(8, result);
    }

    [TestMethod]
    public void Sub_Test()
    {
        Calculator calc = new Calculator();
        Assert.AreEqual(2, calc.Sub(5, 3));
    }
}

}
