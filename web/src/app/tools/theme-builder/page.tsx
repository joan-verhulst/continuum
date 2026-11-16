import Link from 'next/link';
import { ToolPage, toolMetadata } from '../_parts/tool-page';
import { ThemeBuilderTool } from './tool';

/* The theme builder: the app's five steps beside its preview, on the tool page template. */

export const metadata = toolMetadata('theme-builder');

const ThemeBuilderPage = () => (
    <ToolPage
        note={
            <>
                A pair that misses its contrast is marked in its step, and on the preview with
                Check. To test one pair on its own, open the{' '}
                <Link href="/tools/contrast-checker">contrast checker</Link>.
            </>
        }
        slug="theme-builder"
    >
        <ThemeBuilderTool />
    </ToolPage>
);

export default ThemeBuilderPage;
