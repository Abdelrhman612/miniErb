from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    ai_provider: str = "grok"
    grok_api_key: str = ""
    grok_model: str = "grok-beta"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()
