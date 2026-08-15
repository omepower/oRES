import React from "react";

function LoadingScreen() {
return ( <div className="rems-loading-screen"> <div className="rems-loading-content"> <div
                 className="spinner-border rems-spinner"
                 role="status"
             > <span className="visually-hidden">
Loading... </span> </div>

```
            <div className="rems-loading-title">
                REMS
            </div>

            <div className="rems-loading-text">
                Loading your workspace...
            </div>
        </div>
    </div>
);
```

}

export default LoadingScreen;
