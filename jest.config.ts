import {getJestProjectsAsync} from '@nx/jest';

export default async () => ({
  projects: await getJestProjectsAsync(),
  setupFilesAfterEnv: ['<rootDir>/node_modules/@hirez_io/observer-spy/dist/setup-auto-unsubscribe.js'],
});
