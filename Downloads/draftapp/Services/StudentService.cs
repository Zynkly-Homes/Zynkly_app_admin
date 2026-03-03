using draftapp.Models;
using draftapp.Repositories;

namespace draftapp.Services
{
    public class StudentService : IStudentService
    {
        private readonly IStudentRepository _repo;

        public StudentService(IStudentRepository repo)
        {
            _repo = repo;
        }

        public Task<List<Student>> SearchAsync(string q = null) => _repo.GetAllAsync(q);

        public Task<Student?> GetAsync(int id) => _repo.GetByIdAsync(id);

        public async Task<(bool ok, string message)> CreateAsync(Student student)
        {
            if (string.IsNullOrWhiteSpace(student.FullName))
                return (false, "Full Name is required.");

            if (string.IsNullOrWhiteSpace(student.Email))
                return (false, "Email is required.");

            if (await _repo.EmailExistsAsync(student.Email))
                return (false, "Email already exists.");

            await _repo.AddAsync(student);
            return (true, "Student created successfully.");
        }

        public async Task UpdateAsync(Student student)
        {
            await _repo.UpdateAsync(student);
        }

        public async Task DeleteAsync(int id)
        {
            await _repo.DeleteAsync(id);
        }

        public async Task<bool> EmailExistsAsync(string email, int? ignoreStudentId = null)
        {
            return await _repo.EmailExistsAsync(email, ignoreStudentId);
        }
    }
}
