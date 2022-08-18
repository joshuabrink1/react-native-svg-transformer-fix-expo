import React, { memo, useEffect, useState } from "react";

interface Props {
  source: any;
  width?: number | string;
  height?: number | string;
  fill?: string;
  replace: any;
  className?: string;
  style?: React.CSSProperties;
}

const regBase64 = /^(.+)\,(.+)$/;
const regPropReplace = /^\s*\{\s*([a-zA-Z0-9]*)\.?([a-zA-Z0-9]+)\s*\}\s*$/;

const Index = memo(({ source: orsource, replace, ...rest }: Props) => {
  const { style, className } = rest;

  const [xml, setXml] = useState(null);
  const [source, setSource] = useState(null);

  const xmlToBase64 = (xml: string) => {
    let nxml = xml;

    for (const key in replace) {
      let value = replace[key];

      if (regPropReplace.test(value)) {
        value = rest[value.replace(regPropReplace, "$2")];

        if (value == undefined) break;
      }

      nxml = nxml.replace(
        new RegExp(`([a-z-A-Z0-9\-\_]+="|')(${key})("|')`, "g"),
        `$1${value}$3`
      );
    }

    return `data:image/svg+xml;base64,${btoa(nxml)}`;
  };

  useEffect(() => {
    if (!source) {
      if (orsource instanceof String) {
        setSource(orsource);
      } else {
        orsource.then((source: any) => setSource(source.default));
      }
    } else {
      const ab = new AbortController();

      if (regBase64.test(source)) {
        setXml(atob(source.replace(regBase64, "$2")));
      } else {
        fetch(source, { signal: ab.signal })
          .then((res) => res.text())
          .then((xml) => setXml(xml))
          .catch((e) => console.error(e));
      }

      return () => {
        ab.abort();
      };
    }
  }, [source]);

  return xml ? (
    <img
      className={className}
      style={style}
      src={xmlToBase64(xml)}
    />
  ) : null;
});

export default (svgrrc: any) => {
  const { replaceAttrValues } = svgrrc;

  return (source: string) => {
    return (props: any) => (
      <Index {...props} replace={replaceAttrValues} source={source} />
    );
  };
};
