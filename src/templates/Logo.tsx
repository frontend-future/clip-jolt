import Image from 'next/image';

import { AppConfig } from '@/utils/AppConfig';

export const Logo = (props: {
  isTextHidden?: boolean;
}) => (
  <div className="flex items-center gap-2 text-xl font-semibold">
    <Image
      src="/clipjolt-logo.png"
      alt="ClipJolt Logo"
      width={32}
      height={32}
      className="size-8"
    />
    {!props.isTextHidden && <span className="font-semibold">{AppConfig.name}</span>}
  </div>
);
