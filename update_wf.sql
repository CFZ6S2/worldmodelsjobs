UPDATE workflow_entity SET active = false;
UPDATE workflow_entity SET active = true WHERE name = 'WorldModelsJobs - Premium Final Fixed';
SELECT id, name, active FROM workflow_entity WHERE active = true;
