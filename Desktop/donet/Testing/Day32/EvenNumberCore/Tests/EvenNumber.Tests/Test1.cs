using Microsoft.VisualStudio.TestTools.UnitTesting;
using EvenNumber.Core;
using System;

namespace EvenNumber.Tests
{
    [TestClass]
    public class EvenNumberServiceTest
    {
        [TestMethod]
        public void AcceptEven_WithEvenNumber_ReturnsNumber()
        {
            var service = new EvenNumberService();
            int result = service.AcceptEven(4);
            Assert.AreEqual(4, result);
        }

       [TestMethod]
public void AcceptEven_WithOddNumber_ThrowsException()
{
    var service = new EvenNumberService();
    service.AcceptEven(10);  
}

    }
}
