import { axiosInstance } from '@/api/axios.ts';

export default async (data: AdminSettings['server']): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put('/api/admin/settings', {
        server: {
          max_file_manager_view_size: data.maxFileManagerViewSize,
          max_schedules_step_count: data.maxSchedulesStepCount,
          allow_overwriting_custom_docker_image: data.allowOverwritingCustomDockerImage,
          allow_editing_startup_command: data.allowEditingStartupCommand,
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
