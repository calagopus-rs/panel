import { axiosInstance } from '@/api/axios';

export default async (data: AdminSettings['server']): Promise<void> => {
  return new Promise((resolve, reject) => {
    axiosInstance
      .put(`/api/admin/settings`, {
        server: {
          max_file_manager_view_size: data.maxFileManagerViewSize,
          allow_overwriting_custom_docker_image: data.allowOverwritingCustomDockerImage,
          allow_editing_startup_command: data.allowEditingStartupCommand,
        },
      })
      .then(() => resolve())
      .catch(reject);
  });
};
