using backend.DTOs;

namespace backend.Interfaces;

public interface IAuthService
{
    Task<UserResponseDto> CreateUserAsync(CreateUserDto dto);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto dto);
    Task<CurrentUserResponseDto> GetCurrentUserAsync(int userId);
    Task<IEnumerable<UserResponseDto>> GetAllUsersAsync();
    Task DeleteUserAsync(int userId);
}
