namespace backend.Exceptions;

/// <summary>Thrown when a requested resource is not found.</summary>
public class NotFoundException : Exception
{
    public NotFoundException(string message) : base(message) { }
}

/// <summary>Thrown when a business rule is violated (e.g., duplicate code, negative price).</summary>
public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message) { }
}

/// <summary>Thrown when a conflict exists (e.g., trying to delete a referenced entity).</summary>
public class ConflictException : Exception
{
    public ConflictException(string message) : base(message) { }
}
