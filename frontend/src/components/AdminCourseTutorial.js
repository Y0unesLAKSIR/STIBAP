import React from 'react';

const AdminCourseTutorial = () => (
  <div className="admin-course-tutorial">
    <h3>Course Bundle Overview</h3>
    <ol>
      <li>
        <strong>Create a ZIP archive</strong> containing the folders below:
        <ul>
          <li><code>course.json</code> – core course metadata</li>
          <li><code>modules/</code> – one folder per module with <code>module.json</code> and nested <code>units/</code></li>
          <li><code>assets/</code> – optional downloadable files used in units</li>
        </ul>
      </li>
      <li>
        <strong>Fill out <code>course.json</code></strong> with fields such as:
        <pre>{`{
  "title": "Practical Data Science",
  "description": "Hands-on, project-based program",
  "category_id": "<UUID>",
  "difficulty_id": "<UUID>",
  "duration_minutes": 720,
  "keywords": ["python", "data", "ml"],
  "prerequisites": ["basic-statistics"],
  "learning_outcomes": ["Build ML models", "Deploy pipelines"],
  "modules": [...],
  "assets": [... optional ...]
}`}</pre>
        Use existing category/difficulty IDs from Supabase.
      </li>
      <li>
        <strong>Describe each module</strong> in <code>modules/&lt;slug&gt;/module.json</code>:
        <pre>{`{
  "title": "Module 1: Foundations",
  "description": "Core concepts to get started",
  "order_index": 1,
  "units": [
    {
      "title": "Chapter 1: Tooling",
      "unit_type": "chapter",
      "order_index": 1,
      "content": { "format": "markdown", "body": "# Welcome..." },
      "assets": [
        {
          "file": "assets/slides/session-1.pdf",
          "file_name": "Session 1 Slides",
          "metadata": { "type": "pdf" }
        }
      ]
    },
    {
      "title": "Exercise 1",
      "unit_type": "exercise",
      "order_index": 2,
      "content": { "format": "markdown", "body": "## Tasks..." }
    }
  ]
}`}</pre>
      </li>
      <li>
        <strong>Optional shared assets</strong>: list them in <code>course.json</code> under <code>"assets"</code> if they are reused across multiple modules.
      </li>
      <li>
        <strong>Upload the ZIP</strong> using the importer. To update an existing course, paste its ID before uploading.
      </li>
    </ol>
    <p className="tip">Tip: after each import, reload the recommendations via "Reload Courses" in the admin panel so the AI index stays current.</p>
  </div>
);

export default AdminCourseTutorial;
