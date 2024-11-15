# shopify-app-bridge-v4-max-modal
i am slightly fucking annoyed that i had to code this myself if we're being completely honest

this is a generic implementation of app bridge react v4 max modal with reset/save buttons. use this in the default shopify remix template. i am assuming you got here after reading the docs and going 'what the fuck' so im not going to explain the whole thing but [here are some docs](https://shopify.dev/docs/api/app-bridge/using-modals-in-your-app)) and [for some reason a separate page of docs here](https://shopify.dev/docs/api/app-bridge-library/react-components/modal-component) and dont forget these [docs about migration that have some important stuff about AppProvider](https://shopify.dev/docs/api/app-bridge/migration-guide) 

changing the src and then opening the modal doesnt work for me. i would just make a little wrapper like this wherever you're going to have a list of things that can be opened in a modal (IndexTable etc)

```
const ExampleModal = ({ id, src }: { id: string, src: string }) => {
    const { openModal, ...modalProps } = useAppBridgeV4Modal({
        id,
        src,
        title: "i <3 modals",
    });
    return (
        <>
            <AppBridgeV4Modal {...modalProps} />
            <Button
                variant="secondary"
                role={"button"}
                onClick={() => openModal()}
            >
                open me
            </Button>
        </>
    );
}
```


for the modal contents themselves, you have to make a route OUTSIDE the context of your app.tsx route. so dont put "app." in the route file name. like it still goes in /routes but name the file itself `literally-anything.tsx`.  this route file needs to have ALL the boilerplate from your boilerplate app.tsx route file EXCEPT the nav menu stuff. so grab the CSS imports, AppProvider, loader(), everything and copy pasta that shit to this new route file. then put your modal component in that route file as the default export. this is assuming remix routing as of 11.14.24, i guess they're adding alternatives to file based routing with v3

anyways, inside this route, assuming you're using the default shopify react form lib, you can just pass the form.dirty val into the useInnerAppBridgeV4Modal hook along with a callback for onSave and onReset. like so

```
const handleSave = async () => {
        await submitAll();
    };
    const handleDiscard = () => {
        tileForm.reset();
        clearNewResources();
    };
    useInnerAppBridgeV4Modal({
        onSave: () => void handleSave(),
        onReset: () => handleDiscard(),
        dirty: tileForm.dirty,
    });
```

I've had issues with css modules not loading for the first 2 seconds, not sure if its a skill issue or if its just something we have to deal with tbh.

you're most likely going to want to do useFetcher from inside the route rather than submitting directly to the url. like I guess you probably could but it feels very weird to me to do that so I'm using useFetcher
    
