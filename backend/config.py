"""
Configuration management for the STIBAP backend
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings"""
    
    # Supabase Configuration
    supabase_url: str
    supabase_key: str
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_reload: bool = True
    
    # CORS
    cors_origins: str = "http://localhost:3000"
    
    # AI Model Configuration
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2"
    model_cache_dir: str = "./models"
    
    # Recommendation Settings
    min_confidence_score: float = 0.5  # Increased from 0.3 for better relevance
    max_recommendations: int = 10
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Convert comma-separated CORS origins to list"""
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        protected_namespaces = ('settings_',)  # Fix Pydantic warning


# Global settings instance
settings = Settings()
