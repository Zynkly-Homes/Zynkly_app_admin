using Microsoft.AspNetCore.Mvc;
using draftapp.Models;
using draftapp.Services;

namespace draftapp.Controllers
{
    public class StudentsController : Controller
    {
        private readonly IStudentService _studentService;

        public StudentsController(IStudentService studentService)
        {
            _studentService = studentService;
        }

        // GET: Students
        public async Task<IActionResult> Index(string q)
        {
            var students = await _studentService.SearchAsync(q);
            ViewBag.SearchQuery = q;
            return View(students);
        }

        // GET: Students/Details/5
        public async Task<IActionResult> Details(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var student = await _studentService.GetAsync(id.Value);
            if (student == null)
            {
                return NotFound();
            }

            return View(student);
        }

        // GET: Students/Create
        public IActionResult Create()
        {
            return View();
        }

        // POST: Students/Create
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create([Bind("StudentId,FullName,Email,Phone,Status,JoinDate")] Student student)
        {
            if (ModelState.IsValid)
            {
                student.CreatedAt = DateTime.Now;
                var (ok, message) = await _studentService.CreateAsync(student);

                if (!ok)
                {
                    ModelState.AddModelError("", message);
                    return View(student);
                }

                return RedirectToAction(nameof(Index));
            }
            return View(student);
        }

        // GET: Students/Edit/5
        public async Task<IActionResult> Edit(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var student = await _studentService.GetAsync(id.Value);
            if (student == null)
            {
                return NotFound();
            }
            return View(student);
        }

        // POST: Students/Edit/5
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, [Bind("StudentId,FullName,Email,Phone,Status,JoinDate,CreatedAt")] Student student)
        {
            if (id != student.StudentId)
            {
                return NotFound();
            }

            if (ModelState.IsValid)
            {
                // Check if email already exists (excluding current student)
                if (await _studentService.EmailExistsAsync(student.Email, student.StudentId))
                {
                    ModelState.AddModelError("Email", "This email is already registered.");
                    return View(student);
                }

                await _studentService.UpdateAsync(student);
                return RedirectToAction(nameof(Index));
            }
            return View(student);
        }

        // GET: Students/Delete/5
        public async Task<IActionResult> Delete(int? id)
        {
            if (id == null)
            {
                return NotFound();
            }

            var student = await _studentService.GetAsync(id.Value);
            if (student == null)
            {
                return NotFound();
            }

            return View(student);
        }

        // POST: Students/Delete/5
        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id)
        {
            await _studentService.DeleteAsync(id);
            return RedirectToAction(nameof(Index));
        }
    }
}
