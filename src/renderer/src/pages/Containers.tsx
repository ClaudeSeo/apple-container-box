import { ContainerList } from '@/components/containers'

/**
 * 컨테이너 목록 페이지
 * - 컨테이너 목록
 * - 필터/검색
 * - 컨테이너 액션 (start, stop, restart, remove)
 * - 컨테이너 생성
 */
export default function Containers(): JSX.Element {
  return <ContainerList />
}
